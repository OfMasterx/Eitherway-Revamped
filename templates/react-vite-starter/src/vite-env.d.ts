/// <reference types="vite/client" />

declare module 'react' {
  interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
    credentialless?: '' | 'true' | 'false';
  }
}
