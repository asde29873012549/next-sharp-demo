import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import sharp from "sharp";
import { fileTypeFromFile } from "file-type";
import formidable from "formidable";

export const config = {
	api: {
		bodyParser: false,
	},
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	let mimeType: string  = "";
	let fileArray: string[] = [];

	try {
		const form = formidable({
			maxFiles: 20,
			maxFields: 2,
		});
		const [fields, files] = await form.parse(req);

		fileArray = Object.values(files).map((f) => f?.[0].filepath ?? "");

		const base64Image = await Promise.all(
			fileArray.map(async (f) => {
				mimeType = await checkFileType(f);
	
				const Image = sharp(f);
				const imageBuffer = await handleResizeImage(Image, 1000, 1000);

				isImageSizeValid(imageBuffer, parseInt(fields.minFileSize?.[0] ?? ""), parseInt(fields.maxFileSize?.[0] ?? ""))

				return new Promise((resolve, reject) => {
					const base64String = imageBuffer.toString("base64");
					resolve(`data:${mimeType || "image/jpeg"};base64,${base64String}`);
				});

			})
		);

		res.setHeader("Content-Type", mimeType || "image/jpeg");
		res.status(200).json({ image: base64Image });
	} catch (err) {
		res.status(400).json({ message: err.message });
	} finally {
		try {
			fileArray.forEach((file) => {
				file && fs.unlink(file, (err) => {
					if (err) throw err;
				});
			});
		} catch (err) {
			console.log(err);
		}
	}
}

const isImageSizeValid = async (Image: Buffer, minFileSize: number = 50 * 1024, maxFileSize: number = 1000 * 1024) => {
	const { size } = await sharp(Image).metadata();
	if (!size) throw new Error("Image size is not valid");
	if (size < (minFileSize * 1024)) throw new Error("Image size is too small");
	if (size > (maxFileSize * 1024)) throw new Error("Image size is too large");
	return true;
}

const handleResizeImage = (Image: sharp.Sharp, width: number, height: number) => {
	return Image.resize(width, height).toBuffer();
}

const checkFileType = async (file: string) => {
	const allowFileType = ["image/jpg", "image/jpeg"];
	const fileType = await fileTypeFromFile(file);

	if (!allowFileType.includes(fileType.mime)) {
		throw new Error("File type is not allowed");
	}

	return fileType.mime;
}