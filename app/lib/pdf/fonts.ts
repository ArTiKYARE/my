// Регистрация кириллических шрифтов Roboto (OFL) для react-pdf.
// TTF лежат рядом в ./fonts (скачаны из googlefonts/roboto, hinted).

import { Font } from "@react-pdf/renderer";
import path from "path";

const FONTS_DIR = path.join(process.cwd(), "app", "lib", "pdf", "fonts");

let registered = false;

export function registerPdfFonts(): void {
  if (registered) return;
  Font.register({
    family: "Roboto",
    fonts: [
      { src: path.join(FONTS_DIR, "Roboto-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONTS_DIR, "Roboto-Medium.ttf"), fontWeight: 500 },
      { src: path.join(FONTS_DIR, "Roboto-Bold.ttf"), fontWeight: 700 },
    ],
  });
  registered = true;
}
