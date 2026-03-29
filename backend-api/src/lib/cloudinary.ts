import { v2 as cloudinary, type UploadApiOptions } from "cloudinary";
import { config } from "../config/env";

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

function upload(
  buffer: Buffer,
  options: UploadApiOptions
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      })
      .end(buffer);
  });
}

export async function subirFotoRostro(buffer: Buffer, bitacoraId: string) {
  return upload(buffer, {
    upload_preset: config.cloudinary.presetImagenes,
    folder: `campo/rostros/${bitacoraId}`,
    public_id: `rostro-${bitacoraId}`,
    resource_type: "image",
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face", quality: 80, fetch_format: "webp" },
    ],
  });
}

export async function subirFirma(buffer: Buffer, bitacoraId: string) {
  return upload(buffer, {
    upload_preset: config.cloudinary.presetImagenes,
    folder: `campo/firmas/${bitacoraId}`,
    public_id: `firma-${bitacoraId}`,
    resource_type: "image",
  });
}

export async function subirFotoCampo(buffer: Buffer, tecnicoId: string, mes: number, index: number) {
  return upload(buffer, {
    upload_preset: config.cloudinary.presetImagenes,
    folder: `campo/fotos/${tecnicoId}/${mes}`,
    public_id: `foto-${Date.now()}-${index}`,
    resource_type: "image",
    transformation: [{ width: 1200, quality: 75, fetch_format: "webp" }],
  });
}

export async function subirPdfBitacora(buffer: Buffer, tecnicoId: string, mes: number, bitacoraId: string) {
  return upload(buffer, {
    upload_preset: config.cloudinary.presetDocs,
    folder: `campo/pdfs/${tecnicoId}/${mes}`,
    public_id: `pdf-${bitacoraId}`,
    resource_type: "raw",
  });
}
