import { getImageFiles } from "@/utils/getImageFiles";
import Slideshow from "@/components/Slideshow";

export default function Home() {
  const images = getImageFiles();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Slideshow images={images} />
    </main>
  );
}
