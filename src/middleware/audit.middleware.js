const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

// Middleware do automatycznego logowania operacji
const auditLogger = (action, resourceType = null, severity = 'medium') => {
  return async (req, res, next) => {
    const originalSend = res.send;

    // Zapisujemy dane przed wykonaniem akcji
    const auditData = {
      userId: req.user ? req.user._id : null,
      action,
      resourceType,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity,
      metadata: {
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        // Nie logujemy body dla bezpieczeństwa danych wrażliwych
        hasBody: !!req.body && Object.keys(req.body).length > 0
      }
    };

    // Zastępujemy metodę send, aby przechwycić odpowiedź
    res.send = function(data) {
      res.send = originalSend;

      // Zapisujemy audit log asynchronicznie po wysłaniu odpowiedzi
      setImmediate(async () => {
        try {
          // Jeśli operacja się powiodła, dodajemy więcej szczegółów
          if (res.statusCode < 400) {
            if (req.params.id) {
              auditData.resourceId = req.params.id;
            }

            // Próbujemy wyciągnąć ID z odpowiedzi
            if (typeof data === 'string') {
              try {
                const responseData = JSON.parse(data);
                if (responseData.data && responseData.data._id) {
                  auditData.resourceId = responseData.data._id;
                }
              } catch (e) {
                // Ignorujemy błędy parsowania
              }
            }

            auditData.details = `${action} completed successfully`;
          } else {
            auditData.details = `${action} failed with status ${res.statusCode}`;
            auditData.severity = 'high';
          }

          auditData.metadata.statusCode = res.statusCode;

          await AuditLog.create(auditData);

          logger.info(`Audit log created: ${action}`, {
            userId: auditData.userId,
            action,
            resourceType,
            statusCode: res.statusCode
          });
        } catch (error) {
          logger.error(`Failed to create audit log: ${error.message}`, {
            action,
            error: error.stack
          });
        }
      });

      return originalSend.call(this, data);
    };

    next();
  };
};

// Middleware do logowania zmian w konkretnych polach
const auditFieldChanges = (Model, sensitiveFields = []) => {
  return async (req, res, next) => {
    if (req.method === 'PUT' || req.method === 'PATCH') {
      try {
        const resourceId = req.params.id;
        const originalResource = await Model.findById(resourceId);

        if (originalResource) {
          req.originalResource = originalResource.toObject();
          req.sensitiveFields = sensitiveFields;
        }
      } catch (error) {
        logger.error(`Error fetching original resource for audit: ${error.message}`);
      }
    }

    // Override res.send to capture the updated resource
    const originalSend = res.send;
    res.send = function(data) {
      res.send = originalSend;

      if (req.originalResource && res.statusCode < 400) {
        setImmediate(async () => {
          try {
            const updatedResource = await Model.findById(req.params.id);
            if (updatedResource) {
              const changes = detectChanges(
                req.originalResource, 
                updatedResource.toObject(),
                req.sensitiveFields
              );

              if (changes.length > 0) {
                await AuditLog.create({
                  userId: req.user._id,
                  action: 'FIELD_CHANGES',
                  resourceType: Model.modelName,
                  resourceId: req.params.id,
                  details: `Fields modified: ${changes.map(c => c.field).join(', ')}`,
                  metadata: { changes },
                  severity: 'medium',
                  ipAddress: req.ip,
                  userAgent: req.get('User-Agent')
                });
              }
            }
          } catch (error) {
            logger.error(`Error creating field change audit: ${error.message}`);
          }
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

// Funkcja pomocnicza do wykrywania zmian
function detectChanges(original, updated, sensitiveFields = []) {
  const changes = [];

  function compareObjects(obj1, obj2, path = '') {
    Object.keys(obj2).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;

      if (obj1[key] !== obj2[key]) {
        if (typeof obj2[key] === 'object' && obj2[key] !== null) {
          if (typeof obj1[key] === 'object' && obj1[key] !== null) {
            compareObjects(obj1[key], obj2[key], currentPath);
          } else {
            changes.push({
              field: currentPath,
              oldValue: sensitiveFields.includes(currentPath) ? '[HIDDEN]' : obj1[key],
              newValue: sensitiveFields.includes(currentPath) ? '[HIDDEN]' : obj2[key]
            });
          }
        } else {
          changes.push({
            field: currentPath,
            oldValue: sensitiveFields.includes(currentPath) ? '[HIDDEN]' : obj1[key],
            newValue: sensitiveFields.includes(currentPath) ? '[HIDDEN]' : obj2[key]
          });
        }
      }
    });
  }

  compareObjects(original, updated);
  return changes;
}

module.exports = {
  auditLogger,
  auditFieldChanges
};
