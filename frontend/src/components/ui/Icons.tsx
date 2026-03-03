import type { ReactNode } from 'react';

const size = 16;
const svgProps = { width: size, height: size, fill: 'currentColor', viewBox: '0 0 24 24' };

function IconWrap({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center justify-center" role="img" aria-label={label}>
      {children}
    </span>
  );
}

export const Icons = {
  Home: () => (
    <IconWrap label="Home">
      <svg {...svgProps}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
    </IconWrap>
  ),
  Edit: () => (
    <IconWrap label="Edit">
      <svg {...svgProps}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
    </IconWrap>
  ),
  List: () => (
    <IconWrap label="List">
      <svg {...svgProps}><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
    </IconWrap>
  ),
  Book: () => (
    <IconWrap label="Knowledge base">
      <svg {...svgProps}><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
    </IconWrap>
  ),
  Lightbulb: () => (
    <IconWrap label="Theme">
      <svg {...svgProps}><path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/></svg>
    </IconWrap>
  ),
  Question: () => (
    <IconWrap label="Help">
      <svg {...svgProps}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
    </IconWrap>
  ),
  Close: () => (
    <IconWrap label="Close">
      <svg {...svgProps}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </IconWrap>
  ),
  Delete: () => (
    <IconWrap label="Delete">
      <svg {...svgProps}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
    </IconWrap>
  ),
  More: () => (
    <IconWrap label="More">
      <svg {...svgProps}><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
    </IconWrap>
  ),
  Plus: () => (
    <IconWrap label="Add">
      <svg {...svgProps}><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
    </IconWrap>
  ),
  Play: () => (
    <IconWrap label="Run">
      <svg {...svgProps}><path d="M8 5v14l11-7z"/></svg>
    </IconWrap>
  ),
  History: () => (
    <IconWrap label="History">
      <svg {...svgProps}><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
    </IconWrap>
  ),
  Settings: () => (
    <IconWrap label="Settings">
      <svg {...svgProps}><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
    </IconWrap>
  ),
  Download: () => (
    <IconWrap label="Download">
      <svg {...svgProps}><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
    </IconWrap>
  ),
  Upload: () => (
    <IconWrap label="Upload">
      <svg {...svgProps}><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg>
    </IconWrap>
  ),
  CheckCircle: () => (
    <IconWrap label="Success">
      <svg {...svgProps}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
    </IconWrap>
  ),
  TableColumnDelete: () => (
    <IconWrap label="Delete column">
      <svg {...svgProps}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v14zM18 5v14H6V5h12z"/></svg>
    </IconWrap>
  ),
  Folder: () => (
    <IconWrap label="Folder">
      <svg {...svgProps}><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
    </IconWrap>
  ),
  Save: () => (
    <IconWrap label="Save">
      <svg {...svgProps}><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
    </IconWrap>
  ),
  Image: () => (
    <IconWrap label="Image">
      <svg {...svgProps}><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
    </IconWrap>
  ),
  Bug: () => (
    <IconWrap label="Debug">
      <svg {...svgProps}><path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.06.33-.09.66-.09 1v1H4v2h2v1c0 .34.03.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.06-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.03-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/></svg>
    </IconWrap>
  ),
  FileText: () => (
    <IconWrap label="File">
      <svg {...svgProps}><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
    </IconWrap>
  ),
  Undo: () => (
    <IconWrap label="Undo">
      <svg {...svgProps}><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
    </IconWrap>
  ),
  Redo: () => (
    <IconWrap label="Redo">
      <svg {...svgProps}><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>
    </IconWrap>
  ),
  Scissor: () => (
    <IconWrap label="Cut">
      <svg {...svgProps}><path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm4-8.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5z"/></svg>
    </IconWrap>
  ),
  Copy: () => (
    <IconWrap label="Copy">
      <svg {...svgProps}><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
    </IconWrap>
  ),
  Appstore: () => (
    <IconWrap label="Toolbox">
      <svg {...svgProps}><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
    </IconWrap>
  ),
  Safety: () => (
    <IconWrap label="Config store">
      <svg {...svgProps}><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
    </IconWrap>
  ),
  Stop: () => (
    <IconWrap label="Stop">
      <svg {...svgProps}><path d="M6 6h12v12H6z"/></svg>
    </IconWrap>
  ),
  Globe: () => (
    <IconWrap label="Globe">
      <svg {...svgProps}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
    </IconWrap>
  ),
  Clock: () => (
    <IconWrap label="Clock">
      <svg {...svgProps}><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
    </IconWrap>
  ),
  Branch: () => (
    <IconWrap label="Branch">
      <svg {...svgProps}><path d="M17 20h2v-2h-2v2zm0-4h2v-2h-2v2zm0-4h2V9h-2v3zm-4 8h2v-2h-2v2zM5 4v16h2V4H5zm2 16h2v-2H7v2zm4 0h2v-2h-2v2zm0-4h2v-2h-2v2zm0-8h2V4h-2v4zm4 8h2v-2h-2v2zm0-4h2v-2h-2v2zm0-4h2V4h-2v4z"/></svg>
    </IconWrap>
  ),
  Tool: () => (
    <IconWrap label="Tool">
      <svg {...svgProps}><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>
    </IconWrap>
  ),
  Database: () => (
    <IconWrap label="Database">
      <svg {...svgProps}><path d="M4 6v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2zm2 0h12v3H6V6zm0 5h12v3H6v-3zm0 5h12v3H6v-3z"/></svg>
    </IconWrap>
  ),
  Mail: () => (
    <IconWrap label="Mail">
      <svg {...svgProps}><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
    </IconWrap>
  ),
  Inbox: () => (
    <IconWrap label="Inbox">
      <svg {...svgProps}><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12h-4c0 1.66-1.34 3-3 3s-3-1.34-3-3H5V5h14v10z"/></svg>
    </IconWrap>
  ),
  Code: () => (
    <IconWrap label="Code">
      <svg {...svgProps}><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
    </IconWrap>
  ),
  Apartment: () => (
    <IconWrap label="Switch">
      <svg {...svgProps}><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
    </IconWrap>
  ),
  Partition: () => (
    <IconWrap label="Flow">
      <svg {...svgProps}><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>
    </IconWrap>
  ),
  CloudServer: () => (
    <IconWrap label="Server">
      <svg {...svgProps}><path d="M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM20 3H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
    </IconWrap>
  ),
  Forward: () => (
    <IconWrap label="Forward">
      <svg {...svgProps}><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
    </IconWrap>
  ),
  Api: () => (
    <IconWrap label="API">
      <svg {...svgProps}><path d="M14 12l-2 2-2-2 2-2 2 2zm-6.5 6L4 17.5 7.5 14 4 10.5 7.5 7 11 10.5 7.5 14zm13-3L17 11l-3.5 3.5L17 18l3.5-3.5L17 11zm-3.5-5L13 4l3.5 3.5L13 11l-3.5-3.5L13 4z"/></svg>
    </IconWrap>
  ),
  Bell: () => (
    <IconWrap label="Notification">
      <svg {...svgProps}><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
    </IconWrap>
  ),
  Schedule: () => (
    <IconWrap label="Schedule">
      <svg {...svgProps}><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
    </IconWrap>
  ),
  TrendingUp: () => (
    <IconWrap label="Trending up">
      <svg {...svgProps}><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
    </IconWrap>
  ),
  TrendingDown: () => (
    <IconWrap label="Trending down">
      <svg {...svgProps}><path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z"/></svg>
    </IconWrap>
  ),
  Chart: () => (
    <IconWrap label="Chart">
      <svg {...svgProps}><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>
    </IconWrap>
  ),
} as const;

export type IconName = keyof typeof Icons;
export function Icon({ name }: { name: IconName }): ReactNode {
  const C = Icons[name];
  return C ? <C /> : null;
}
