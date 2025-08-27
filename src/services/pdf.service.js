const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const { formatDate } = require('../utils/formatters');

class PDFService {
  constructor() {
    this.templatePath = path.join(__dirname, '../../public/templates');
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async generatePatientCard(patientId) {
    try {
      const Patient = require('../models/Patient');
      const Visit = require('../models/Visit');

      const patient = await Patient.findById(patientId)
        .populate('visits')
        .populate('documents')
        .populate('createdBy', 'firstName lastName');

      if (!patient) {
        throw new Error('Patient not found');
      }

      // Pobierz ostatnie 5 wizyt
      const recentVisits = await Visit.find({ patient: patientId })
        .populate('employee', 'personalInfo')
        .populate('services.service', 'name')
        .sort({ visitDate: -1 })
        .limit(5);

      const templateData = {
        patient,
        recentVisits,
        generatedDate: formatDate(new Date(), 'datetime'),
        generatedBy: 'System Placówki Fizjoterapeutycznej'
      };

      const html = await this.renderTemplate('patient-card.html', templateData);

      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.setContent(html);
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      await page.close();

      logger.info(`Patient card PDF generated for patient: ${patientId}`);

      return pdf;
    } catch (error) {
      logger.error(`Error generating patient card PDF: ${error.message}`);
      throw error;
    }
  }

  async generateVisitReport(visitId) {
    try {
      const Visit = require('../models/Visit');

      const visit = await Visit.findById(visitId)
        .populate('patient', 'personalInfo')
        .populate('employee', 'personalInfo')
        .populate('services.service', 'name duration')
        .populate('examination');

      if (!visit) {
        throw new Error('Visit not found');
      }

      const templateData = {
        visit,
        generatedDate: formatDate(new Date(), 'datetime'),
        generatedBy: 'System Placówki Fizjoterapeutycznej'
      };

      const html = await this.renderTemplate('visit-report.html', templateData);

      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.setContent(html);
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      await page.close();

      logger.info(`Visit report PDF generated for visit: ${visitId}`);

      return pdf;
    } catch (error) {
      logger.error(`Error generating visit report PDF: ${error.message}`);
      throw error;
    }
  }

  async generateExaminationReport(examinationId) {
    try {
      const Examination = require('../models/Examination');

      const examination = await Examination.findById(examinationId)
        .populate('patient', 'personalInfo')
        .populate('examiner', 'personalInfo')
        .populate('reviewedBy', 'personalInfo');

      if (!examination) {
        throw new Error('Examination not found');
      }

      const templateData = {
        examination,
        generatedDate: formatDate(new Date(), 'datetime'),
        generatedBy: 'System Placówki Fizjoterapeutycznej'
      };

      const html = await this.renderTemplate('examination-report.html', templateData);

      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.setContent(html);
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      await page.close();

      logger.info(`Examination report PDF generated for examination: ${examinationId}`);

      return pdf;
    } catch (error) {
      logger.error(`Error generating examination report PDF: ${error.message}`);
      throw error;
    }
  }

  async generateMonthlyReport(employeeId, year, month) {
    try {
      const Employee = require('../models/Employee');
      const Visit = require('../models/Visit');

      const employee = await Employee.findById(employeeId)
        .populate('personalInfo');

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Pobierz wizyty z danego miesiąca
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const visits = await Visit.find({
        employee: employeeId,
        visitDate: { $gte: startDate, $lte: endDate },
        status: 'completed'
      })
      .populate('patient', 'personalInfo')
      .populate('services.service', 'name duration price')
      .sort({ visitDate: 1 });

      // Oblicz statystyki
      const totalVisits = visits.length;
      const totalRevenue = visits.reduce((sum, visit) => {
        return sum + (visit.billing?.totalCost || 0);
      }, 0);

      const avgVisitDuration = visits.reduce((sum, visit) => {
        return sum + visit.duration;
      }, 0) / totalVisits || 0;

      const templateData = {
        employee,
        visits,
        year,
        month,
        monthName: new Date(year, month - 1).toLocaleDateString('pl-PL', { month: 'long' }),
        statistics: {
          totalVisits,
          totalRevenue,
          avgVisitDuration: Math.round(avgVisitDuration)
        },
        generatedDate: formatDate(new Date(), 'datetime'),
        generatedBy: 'System Placówki Fizjoterapeutycznej'
      };

      const html = await this.renderTemplate('monthly-report.html', templateData);

      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.setContent(html);
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      await page.close();

      logger.info(`Monthly report PDF generated for employee: ${employeeId}, period: ${year}-${month}`);

      return pdf;
    } catch (error) {
      logger.error(`Error generating monthly report PDF: ${error.message}`);
      throw error;
    }
  }

  async renderTemplate(templateName, data) {
    try {
      const templatePath = path.join(this.templatePath, templateName);
      let template = await fs.readFile(templatePath, 'utf-8');

      // Prosty system templateów - replace {{key}} z wartościami
      const flattenObject = (obj, prefix = '') => {
        const flattened = {};

        Object.keys(obj).forEach(key => {
          const value = obj[key];
          const newKey = prefix ? `${prefix}.${key}` : key;

          if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            Object.assign(flattened, flattenObject(value, newKey));
          } else if (Array.isArray(value)) {
            flattened[newKey] = value;
          } else {
            flattened[newKey] = value;
          }
        });

        return flattened;
      };

      const flatData = flattenObject(data);

      // Replace prostych zmiennych
      Object.keys(flatData).forEach(key => {
        const regex = new RegExp(`{{\s*${key}\s*}}`, 'g');
        let value = flatData[key];

        if (value instanceof Date) {
          value = formatDate(value);
        } else if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        }

        template = template.replace(regex, value);
      });

      // Replace pozostałych zmiennych pustym stringiem
      template = template.replace(/{{[^}]+}}/g, '');

      return template;
    } catch (error) {
      logger.error(`Error rendering template ${templateName}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new PDFService();
