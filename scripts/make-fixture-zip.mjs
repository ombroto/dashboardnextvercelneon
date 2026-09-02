import archiver from 'archiver';
import { createWriteStream } from 'node:fs';

const output = createWriteStream('tests/fixtures/sertifikat-test.zip');
const archive = archiver('zip');
archive.pipe(output);
archive.append('%PDF-1.4 fake pdf content for matched file', { name: '5555555555555555_SK-TEST-1.pdf' });
archive.append('%PDF-1.4 fake pdf content for unmatched file', { name: 'unrelated-file.pdf' });
await archive.finalize();
