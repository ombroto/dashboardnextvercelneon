import archiver from 'archiver';
import { createWriteStream } from 'node:fs';

const output = createWriteStream('tests/fixtures/sertifikat-test.zip');
const archive = archiver('zip');
archive.pipe(output);

archive.append(
  `folder;email
peserta-cocok;e2e.unique@example.com
peserta-tidak-cocok;tidak-ada@example.com
`,
  { name: 'manifest.csv' }
);
archive.append('%PDF-1.4 fake pdf content for matched file', { name: 'peserta-cocok/certificate.pdf' });
archive.append('%PDF-1.4 fake pdf content for unmatched file', { name: 'peserta-tidak-cocok/certificate.pdf' });

await archive.finalize();
