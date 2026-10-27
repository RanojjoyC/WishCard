// Shared Banks master configuration for consistency across forms, filters, and matching
export const SUPPORTED_BANKS = [
  { id: 'HDFC', label: 'HDFC Bank', defaultCard: 'HDFC Bank Millennia / Regalia' },
  { id: 'ICICI', label: 'ICICI Bank', defaultCard: 'ICICI Amazon Pay' },
  { id: 'AXIS', label: 'Axis Bank', defaultCard: 'Axis Bank Neo / Flipkart' },
  { id: 'SBI', label: 'SBI Card', defaultCard: 'SBI SimplyCLICK / Cashback' },
  { id: 'AMEX', label: 'American Express', defaultCard: 'American Express Membership Rewards' },
  { id: 'KOTAK', label: 'Kotak Mahindra Bank', defaultCard: 'Kotak League Platinum' }
];

export const getBankLabel = (bankId) => {
  if (!bankId) return '';
  const bank = SUPPORTED_BANKS.find(b => b.id.toUpperCase() === bankId.toUpperCase());
  return bank ? bank.label : bankId;
};

export const getBankIdFromText = (text) => {
  if (!text) return '';
  const clean = text.toUpperCase();
  for (const b of SUPPORTED_BANKS) {
    if (clean.includes(b.id) || clean.includes(b.label.toUpperCase())) {
      return b.id;
    }
  }
  return text;
};
