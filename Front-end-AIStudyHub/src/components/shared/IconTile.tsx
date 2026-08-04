import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconTileVariants = cva(
  "inline-flex shrink-0 items-center justify-center select-none [&>svg]:w-full [&>svg]:h-full",
  {
    variants: {
      size: {
        sm: "size-8",
        md: "size-10",
        lg: "size-12",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export function getFileTone(
  fileName?: string,
): "pdf" | "docx" | "xlsx" | "pptx" | "txt" {
  if (!fileName) return "txt";
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "docx" || ext === "doc") return "docx";
  if (ext === "xlsx" || ext === "xls") return "xlsx";
  if (ext === "pptx" || ext === "ppt") return "pptx";
  return "txt";
}

export function getFileIcon(fileName?: string, tone?: string | null) {
  const resolvedTone = tone || (fileName ? getFileTone(fileName) : undefined);
  switch (resolvedTone) {
    case "pdf":
      return <PdfIcon />;
    case "docx":
      return <DocIcon />;
    case "xlsx":
      return <XlsxIcon />;
    case "pptx":
      return <PptxIcon />;
    case "txt":
      return <TxtIcon />;
    default:
      return <GenericFileIcon />;
  }
}

export interface IconTileProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof iconTileVariants> {
  tone?: string | null;
  fileName?: string;
}

export function IconTile({
  className,
  size,
  tone,
  fileName,
  children,
  ...props
}: IconTileProps) {
  const iconToRender = fileName
    ? getFileIcon(fileName, tone)
    : (children ?? getFileIcon(undefined, tone));

  return (
    <span className={cn(iconTileVariants({ size }), className)} {...props}>
      {iconToRender}
    </span>
  );
}

const GenericFileIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 40 40"
    width="40"
    height="40"
    fill="none"
  >
    <path
      stroke="#D5D7DA"
      strokeWidth="1.5"
      d="M4.75 4A3.25 3.25 0 0 1 8 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 32 39.25H8A3.25 3.25 0 0 1 4.75 36z"
    />
    <path stroke="#D5D7DA" strokeWidth="1.5" d="M24 .5V8a4 4 0 0 0 4 4h7.5" />
    <path
      stroke="#155EEF"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M11.9 19.5h16.2m-16.2 3.6h16.2m-16.2 3.6h16.2m-16.2 3.6h12.6"
    />
  </svg>
);

const DocIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 40 40"
    width="40"
    height="40"
    fill="none"
  >
    <path
      stroke="#D5D7DA"
      strokeWidth="1.5"
      d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
    />
    <path stroke="#D5D7DA" strokeWidth="1.5" d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
    <rect width="29" height="16" x="1" y="18" fill="#155EEF" rx="2" />
    <path
      fill="#fff"
      d="M7.402 30H4.824v-7.273h2.599q1.096 0 1.89.437.79.433 1.217 1.246.43.814.43 1.947 0 1.136-.43 1.953a2.95 2.95 0 0 1-1.225 1.253Q8.509 30 7.402 30m-1.04-1.317h.976q.682 0 1.147-.242.468-.244.703-.756.237-.516.238-1.328 0-.807-.238-1.318a1.54 1.54 0 0 0-.7-.753q-.465-.24-1.147-.241h-.98zm12.42-2.32q0 1.19-.45 2.025a3.13 3.13 0 0 1-1.222 1.275 3.45 3.45 0 0 1-1.733.436 3.44 3.44 0 0 1-1.74-.44 3.14 3.14 0 0 1-1.219-1.275q-.447-.834-.447-2.02 0-1.19.447-2.024a3.1 3.1 0 0 1 1.219-1.272 3.44 3.44 0 0 1 1.74-.44q.962 0 1.733.44.774.437 1.221 1.271.45.835.451 2.025m-1.559 0q0-.77-.23-1.3-.228-.529-.643-.802a1.73 1.73 0 0 0-.973-.273 1.73 1.73 0 0 0-.973.273q-.416.274-.647.803-.227.53-.227 1.3t.227 1.3q.231.529.647.802.415.273.973.273.557 0 .973-.273t.642-.803q.231-.528.231-1.3m9.115-1.09h-1.555a1.5 1.5 0 0 0-.174-.536 1.4 1.4 0 0 0-.338-.405 1.5 1.5 0 0 0-.476-.255 1.8 1.8 0 0 0-.578-.09q-.566 0-.984.282-.42.276-.65.81-.23.528-.23 1.285 0 .777.23 1.306.234.53.654.8.419.27.969.27.308 0 .572-.082.266-.082.472-.238.205-.16.34-.387.14-.228.193-.519l1.555.007q-.06.501-.302.966a2.9 2.9 0 0 1-.643.828 3 3 0 0 1-.958.575q-.554.21-1.254.21-.974 0-1.74-.44a3.13 3.13 0 0 1-1.207-1.276q-.44-.834-.44-2.02 0-1.19.447-2.024t1.214-1.272a3.4 3.4 0 0 1 1.726-.44q.632 0 1.172.177.543.179.962.519.42.337.682.827.267.49.341 1.122"
    />
  </svg>
);

const PdfIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 40 40"
    width="40"
    height="40"
    fill="none"
  >
    <path
      stroke="#D5D7DA"
      strokeWidth="1.5"
      d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
    />
    <path stroke="#D5D7DA" strokeWidth="1.5" d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
    <rect width="26" height="16" x="1" y="18" fill="#D92D20" rx="2" />
    <path
      fill="#fff"
      d="M4.832 30v-7.273h2.87q.826 0 1.41.316.582.314.887.87.31.555.31 1.279t-.313 1.278q-.313.555-.906.863-.59.309-1.427.309h-1.83V26.41h1.581q.444 0 .732-.153.29-.156.433-.43.145-.276.145-.635 0-.363-.145-.632a.97.97 0 0 0-.433-.423q-.291-.153-.74-.153H6.37V30zm9.053 0h-2.578v-7.273h2.6q1.095 0 1.889.437.791.433 1.218 1.246.43.814.43 1.947 0 1.136-.43 1.953a2.95 2.95 0 0 1-1.226 1.253q-.795.437-1.903.437m-1.04-1.317h.976q.682 0 1.147-.242.47-.244.703-.756.238-.516.238-1.328 0-.807-.238-1.318a1.54 1.54 0 0 0-.7-.753q-.465-.24-1.146-.241h-.98zM18.582 30v-7.273h4.816v1.268H20.12v1.733h2.958v1.268H20.12V30z"
    />
  </svg>
);

const XlsxIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 40 40"
    width="40"
    height="40"
    fill="none"
  >
    <path
      stroke="#D5D7DA"
      strokeWidth="1.5"
      d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
    />
    <path stroke="#D5D7DA" strokeWidth="1.5" d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
    <rect width="33" height="16" x="1" y="18" fill="#079455" rx="2" />
    <path
      fill="#fff"
      d="m6.312 22.727 1.467 2.479h.057l1.473-2.479h1.737l-2.22 3.637L11.096 30H9.327l-1.491-2.482h-.057L6.287 30H4.526l2.276-3.636-2.233-3.637zM12.02 30v-7.273h1.537v6.005h3.118V30zm9.619-5.181a.9.9 0 0 0-.366-.668q-.323-.238-.877-.238-.376 0-.636.107a.9.9 0 0 0-.397.288.7.7 0 0 0-.135.419.6.6 0 0 0 .081.34.9.9 0 0 0 .253.253q.16.103.369.18.21.075.447.129l.654.156q.476.106.873.284.398.177.69.437.29.259.45.61.164.353.167.807-.004.667-.34 1.157-.334.487-.967.757-.628.266-1.516.266-.881 0-1.534-.27a2.25 2.25 0 0 1-1.016-.799q-.362-.533-.38-1.317h1.488q.025.366.21.61.188.242.5.366.317.12.714.12.39 0 .678-.113a1.04 1.04 0 0 0 .452-.316.73.73 0 0 0 .16-.465q-.001-.244-.146-.412a1.1 1.1 0 0 0-.42-.284 4 4 0 0 0-.67-.213l-.792-.199q-.92-.224-1.453-.7-.532-.475-.529-1.282-.003-.66.352-1.154.359-.493.983-.77.625-.277 1.42-.277.81 0 1.414.277.608.276.945.77t.348 1.144zm4.05-2.092 1.466 2.479h.057l1.473-2.479h1.737l-2.22 3.637L30.471 30h-1.769l-1.491-2.482h-.057L25.662 30h-1.761l2.276-3.636-2.233-3.637z"
    />
  </svg>
);

const PptxIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 40 40"
    width="40"
    height="40"
    fill="none"
  >
    <path
      stroke="#D5D7DA"
      strokeWidth="1.5"
      d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
    />
    <path stroke="#D5D7DA" strokeWidth="1.5" d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
    <rect width="33" height="16" x="1" y="18" fill="#E62E05" rx="2" />
    <path
      fill="#fff"
      d="M4.743 30v-7.273h2.87q.826 0 1.41.316.582.314.887.87.31.555.31 1.279t-.313 1.278q-.313.555-.906.863-.59.309-1.427.309h-1.83V26.41h1.581q.444 0 .732-.153.29-.156.433-.43.145-.276.145-.635 0-.363-.145-.632a.97.97 0 0 0-.433-.423q-.29-.153-.739-.153H6.281V30zm6.475 0v-7.273h2.87q.826 0 1.41.316.58.314.887.87.309.555.309 1.279t-.313 1.278-.905.863q-.59.309-1.428.309H12.22V26.41h1.58q.444 0 .731-.153.292-.156.433-.43.146-.276.146-.635 0-.363-.146-.632a.97.97 0 0 0-.433-.423q-.291-.153-.738-.153h-1.037V30zm6.198-6.005v-1.268h5.973v1.268h-2.227V30h-1.52v-6.005zm8.398-1.268 1.467 2.479h.056l1.474-2.479h1.737l-2.22 3.637L30.598 30h-1.769l-1.492-2.482h-.056L25.789 30h-1.761l2.276-3.636-2.233-3.637z"
    />
  </svg>
);

const TxtIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 40 40"
    width="40"
    height="40"
    fill="none"
  >
    <path
      stroke="#D5D7DA"
      strokeWidth="1.5"
      d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
    />
    <path stroke="#D5D7DA" strokeWidth="1.5" d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
    <rect width="27" height="16" x="1" y="18" fill="#475467" rx="2" />
    <path
      fill="#fff"
      d="M4.601 23.995v-1.268h5.973v1.268H8.348V30h-1.52v-6.005zM13 22.727l1.466 2.479h.057l1.474-2.479h1.736l-2.22 3.637L17.784 30h-1.768l-1.492-2.482h-.057L12.975 30h-1.762l2.277-3.636-2.234-3.637zm5.43 1.268v-1.268h5.972v1.268h-2.226V30h-1.52v-6.005z"
    />
  </svg>
);
