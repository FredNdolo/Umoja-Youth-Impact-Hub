// Member documents (national ID, police clearance) in the private
// 'member-documents' storage bucket. Each person's files sit in a folder named
// after their person id; database policies stop anyone else reading them.
export const DOC_BUCKET = 'member-documents';
export const MAX_DOC_BYTES = 5 * 1024 * 1024;
export const DOC_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export const DOC_TYPES = [
  {
    type: 'national_id',
    label: 'National ID',
    help: 'A clear photo or scan of the front and back of your national ID (or passport).',
  },
  {
    type: 'police_clearance',
    label: 'Police clearance certificate',
    help: 'Your Certificate of Good Conduct from the DCI (eCitizen). Needed before working with children.',
    issued: true,
  },
];

export const DOC_STATUS = {
  pending:  { label: 'Waiting for UYIH to check', cls: 'bg-terracotta/15 text-terracotta-dark' },
  verified: { label: 'Verified',                  cls: 'bg-forest text-cream' },
  rejected: { label: 'Please upload again',       cls: 'bg-red-50 text-red-700' },
};

const EXT = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const docPath = (personId, type, mime) => `${personId}/${type}-${Date.now()}.${EXT[mime] || 'bin'}`;
