declare module 'pdfjs-dist/build/pdf.mjs' {
  export const version: string;
  export const GlobalWorkerOptions: {
    workerSrc: string;
    workerPort: any;
  };
  export function getDocument(src: any): {
    promise: Promise<{
      numPages: number;
      getPage: (pageNumber: number) => Promise<{
        getTextContent: () => Promise<{
          items: Array<{
            str?: string;
            hasEOL?: boolean;
            transform?: number[];
            width?: number;
            [key: string]: any;
          }>;
        }>;
      }>;
    }>;
    destroy?: () => Promise<void>;
  };
}

declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export const version: string;
  export const GlobalWorkerOptions: {
    workerSrc: string;
    workerPort: any;
  };
  export function getDocument(src: any): {
    promise: Promise<{
      numPages: number;
      getPage: (pageNumber: number) => Promise<{
        getTextContent: () => Promise<{
          items: Array<{
            str?: string;
            hasEOL?: boolean;
            transform?: number[];
            width?: number;
            [key: string]: any;
          }>;
        }>;
      }>;
    }>;
    destroy?: () => Promise<void>;
  };
}

declare module '*?url' {
  const src: string;
  export default src;
}
