import Image from "next/image";
import { Inter } from "next/font/google";
import { useState, useRef } from "react";

const inter = Inter({ subsets: ["latin"] });

const readFile = (file: File) => {
  return new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.onload = async (e) => {
	  resolve(e.target?.result);
	};
	reader.onerror = (e) => {
	  reject(e);
	};
	reader.readAsArrayBuffer(file);
  });
};

export default function Home() {
	const [imgSrc, setImgSrc] = useState<string[]>([]);
	const imgRef = useRef<string[] | null>(null);

	const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target?.files ?? []);
		if (!files) return;
		const form = new FormData();
		form.append("maxFileSize", "1000");
		form.append("minFileSize", "50");
		const promises = files.map((file) => readFile(file));

		Promise.all(promises).then((results) => {
			results.forEach((result, i) => {
				form.append(`files[${i}]`, new Blob([result as ArrayBuffer], { type: "image/jpeg" }));
			});

			fetch("/api/upload", {
				method: "POST",
				body: form,
				headers: {
					"x-files": JSON.stringify({ maxFiles: 20, minFileSize: 50, maxFileSize: 1000 }),
				}
			}).then((r) => 	handleReslt(r));

		}).catch((error) => {
			console.error(error);
		});
	}

	const handleReslt = async (res: Response) => {
		const data = await res.json();
		if (!res.ok) {
			console.error(data);
			return;
		}
		const images = data.image;
		
		setImgSrc(images);
		imgRef.current = images;

		images.forEach((image: string, i: number) => {
			const link = document.createElement('a');
			link.href = image;
			link.download = `${i}.jpeg`;

			// Append to the body, click it, and then remove it
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		})
	}

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      <input type="file" accept="image/jpeg" multiple onChange={handleFile} />
	  <div className="grid grid-cols-3 gap-4">
		{imgSrc?.map((src, i) => (
		  <Image
			alt="image"
			key={i}
			src={src}
			width={200}
			height={200}
			className="rounded-md"
		  />
		))}
	</div>
    </main>
  );
}
