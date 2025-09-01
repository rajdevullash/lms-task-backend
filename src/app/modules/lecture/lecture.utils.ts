import multer from 'multer';
import { pdfFileFilter, storage } from '../../../shared/cloudinary';

export const configurePdfUpload = () =>
  multer({
    storage: storage,
    fileFilter: pdfFileFilter,
    limits: {
      fileSize: 1024 * 1024 * 10,
      files: 5,
    },
  }).fields([{ name: 'pdfNotes', maxCount: 5 }]);
