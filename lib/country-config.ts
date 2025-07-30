export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  taxSystem: string;
  taxFields: TaxField[];
  fiscalYear: string;
  dateFormat: string;
  phoneFormat: string;
  addressFormat: string[];
  businessTypes: string[];
  requiredDocuments: string[];
  commonIndustries: string[];
}

export interface TaxField {
  name: string;
  label: string;
  placeholder: string;
  validation: string;
  required: boolean;
  description: string;
}

export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  'IN': {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    currencySymbol: '₹',
    taxSystem: 'GST (Goods and Services Tax)',
    taxFields: [
      {
        name: 'gstNumber',
        label: 'GST Number',
        placeholder: '22AAAAA0000A1Z5',
        validation: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
        required: true,
        description: '15-digit GST identification number'
      },
      {
        name: 'panNumber',
        label: 'PAN Number',
        placeholder: 'ABCDE1234F',
        validation: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$',
        required: true,
        description: '10-character permanent account number'
      }
    ],
    fiscalYear: 'April-March',
    dateFormat: 'DD/MM/YYYY',
    phoneFormat: '+91-XXXXX-XXXXX',
    addressFormat: ['address', 'city', 'state', 'pincode'],
    businessTypes: [
      'Private Limited Company',
      'Public Limited Company', 
      'Partnership Firm',
      'Sole Proprietorship',
      'Limited Liability Partnership (LLP)',
      'One Person Company (OPC)'
    ],
    requiredDocuments: [
      'Certificate of Incorporation',
      'GST Registration Certificate',
      'PAN Card',
      'Memorandum of Association',
      'Articles of Association'
    ],
    commonIndustries: [
      'Information Technology',
      'Manufacturing',
      'Textiles',
      'Pharmaceuticals',
      'Automotive',
      'Agriculture',
      'Healthcare',
      'Education',
      'Real Estate',
      'Financial Services'
    ]
  },
  
  'US': {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    taxSystem: 'Federal Tax System',
    taxFields: [
      {
        name: 'einNumber',
        label: 'EIN (Employer Identification Number)',
        placeholder: '12-3456789',
        validation: '^[0-9]{2}-[0-9]{7}$',
        required: true,
        description: '9-digit federal tax identification number'
      },
      {
        name: 'stateId',
        label: 'State Tax ID',
        placeholder: 'Varies by state',
        validation: '',
        required: false,
        description: 'State-specific tax identification number'
      }
    ],
    fiscalYear: 'January-December',
    dateFormat: 'MM/DD/YYYY',
    phoneFormat: '+1-XXX-XXX-XXXX',
    addressFormat: ['address', 'city', 'state', 'zipCode'],
    businessTypes: [
      'Corporation (C-Corp)',
      'S Corporation (S-Corp)',
      'Limited Liability Company (LLC)',
      'Partnership',
      'Sole Proprietorship',
      'Limited Partnership (LP)',
      'Limited Liability Partnership (LLP)'
    ],
    requiredDocuments: [
      'Articles of Incorporation',
      'EIN Confirmation Letter',
      'Business License',
      'Operating Agreement',
      'Bylaws'
    ],
    commonIndustries: [
      'Technology',
      'Healthcare',
      'Finance',
      'Manufacturing',
      'Retail',
      'Real Estate',
      'Education',
      'Entertainment',
      'Agriculture',
      'Energy'
    ]
  },
  
  'GB': {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    taxSystem: 'VAT (Value Added Tax)',
    taxFields: [
      {
        name: 'vatNumber',
        label: 'VAT Registration Number',
        placeholder: 'GB123456789',
        validation: '^GB[0-9]{9}$',
        required: true,
        description: '12-character VAT registration number'
      },
      {
        name: 'companyNumber',
        label: 'Company Registration Number',
        placeholder: '12345678',
        validation: '^[0-9]{8}$',
        required: true,
        description: '8-digit company registration number'
      }
    ],
    fiscalYear: 'April-March',
    dateFormat: 'DD/MM/YYYY',
    phoneFormat: '+44-XXXX-XXXXXX',
    addressFormat: ['address', 'city', 'county', 'postcode'],
    businessTypes: [
      'Private Limited Company',
      'Public Limited Company',
      'Limited Liability Partnership (LLP)',
      'Partnership',
      'Sole Trader',
      'Community Interest Company (CIC)'
    ],
    requiredDocuments: [
      'Certificate of Incorporation',
      'VAT Registration Certificate',
      'Memorandum of Association',
      'Articles of Association',
      'Companies House Registration'
    ],
    commonIndustries: [
      'Financial Services',
      'Technology',
      'Manufacturing',
      'Healthcare',
      'Education',
      'Retail',
      'Real Estate',
      'Creative Industries',
      'Agriculture',
      'Energy'
    ]
  },

  'CA': {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    currencySymbol: 'C$',
    taxSystem: 'GST/HST (Goods and Services Tax)',
    taxFields: [
      {
        name: 'businessNumber',
        label: 'Business Number (BN)',
        placeholder: '123456789RC0001',
        validation: '^[0-9]{9}RC[0-9]{4}$',
        required: true,
        description: '15-character business number'
      },
      {
        name: 'gstHstNumber',
        label: 'GST/HST Number',
        placeholder: '123456789RT0001',
        validation: '^[0-9]{9}RT[0-9]{4}$',
        required: false,
        description: 'GST/HST registration number'
      }
    ],
    fiscalYear: 'January-December',
    dateFormat: 'DD/MM/YYYY',
    phoneFormat: '+1-XXX-XXX-XXXX',
    addressFormat: ['address', 'city', 'province', 'postalCode'],
    businessTypes: [
      'Corporation',
      'Partnership',
      'Sole Proprietorship',
      'Cooperative',
      'Not-for-profit Corporation'
    ],
    requiredDocuments: [
      'Certificate of Incorporation',
      'Business Number Registration',
      'Articles of Incorporation',
      'Provincial Business License'
    ],
    commonIndustries: [
      'Natural Resources',
      'Technology',
      'Manufacturing',
      'Agriculture',
      'Healthcare',
      'Financial Services',
      'Tourism',
      'Education',
      'Real Estate',
      'Energy'
    ]
  },

  'AU': {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    currencySymbol: 'A$',
    taxSystem: 'GST (Goods and Services Tax)',
    taxFields: [
      {
        name: 'abn',
        label: 'Australian Business Number (ABN)',
        placeholder: '12 345 678 901',
        validation: '^[0-9]{2} [0-9]{3} [0-9]{3} [0-9]{3}$',
        required: true,
        description: '11-digit business identifier'
      },
      {
        name: 'acn',
        label: 'Australian Company Number (ACN)',
        placeholder: '123 456 789',
        validation: '^[0-9]{3} [0-9]{3} [0-9]{3}$',
        required: false,
        description: '9-digit company identifier'
      }
    ],
    fiscalYear: 'July-June',
    dateFormat: 'DD/MM/YYYY',
    phoneFormat: '+61-X-XXXX-XXXX',
    addressFormat: ['address', 'suburb', 'state', 'postcode'],
    businessTypes: [
      'Proprietary Limited Company (Pty Ltd)',
      'Public Company Limited (Ltd)',
      'Partnership',
      'Sole Trader',
      'Trust',
      'Cooperative'
    ],
    requiredDocuments: [
      'Certificate of Registration',
      'ABN Registration',
      'Constitution',
      'ASIC Registration'
    ],
    commonIndustries: [
      'Mining',
      'Agriculture',
      'Tourism',
      'Technology',
      'Manufacturing',
      'Healthcare',
      'Education',
      'Financial Services',
      'Real Estate',
      'Energy'
    ]
  }
};

export function getCountryConfig(countryCode: string): CountryConfig | null {
  return COUNTRY_CONFIGS[countryCode] || null;
}

export function getAllCountries(): CountryConfig[] {
  return Object.values(COUNTRY_CONFIGS);
}

export function validateTaxId(taxId: string, field: TaxField): boolean {
  if (!field.validation) return true;
  const regex = new RegExp(field.validation);
  return regex.test(taxId);
}

export function formatCurrency(amount: number, countryCode: string): string {
  const config = getCountryConfig(countryCode);
  if (!config) return amount.toString();
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: config.currency,
    currencyDisplay: 'symbol'
  }).format(amount);
}

export function formatPhoneNumber(phone: string, countryCode: string): string {
  const config = getCountryConfig(countryCode);
  if (!config) return phone;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Apply country-specific formatting
  switch (countryCode) {
    case 'IN':
      if (digits.length === 10) {
        return `+91-${digits.slice(0, 5)}-${digits.slice(5)}`;
      }
      break;
    case 'US':
    case 'CA':
      if (digits.length === 10) {
        return `+1-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      break;
    case 'GB':
      if (digits.length === 11) {
        return `+44-${digits.slice(1, 5)}-${digits.slice(5)}`;
      }
      break;
    case 'AU':
      if (digits.length === 9) {
        return `+61-${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`;
      }
      break;
  }
  
  return phone; // Return original if formatting fails
}

export function getBusinessTypesByCountry(countryCode: string): string[] {
  const config = getCountryConfig(countryCode);
  return config?.businessTypes || [];
}

export function getIndustriesByCountry(countryCode: string): string[] {
  const config = getCountryConfig(countryCode);
  return config?.commonIndustries || [];
}

export function getRequiredDocuments(countryCode: string): string[] {
  const config = getCountryConfig(countryCode);
  return config?.requiredDocuments || [];
}
