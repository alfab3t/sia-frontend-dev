"use client";

import { useCallback } from "react";
import ValidationError from "./ValidationError";
import {
  Alignment,
  Base64UploadAdapter,
  BlockQuote,
  Bold,
  ClassicEditor,
  CodeBlock,
  Essentials,
  Font,
  Heading,
  Image,
  ImageCaption,
  ImageInsert,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  Italic,
  Link,
  LinkImage,
  List,
  MediaEmbed,
  Mention,
  Paragraph,
  SimpleUploadAdapter,
  Strikethrough,
  Table,
  TableCellProperties,
  TableProperties,
  TableToolbar,
  Underline,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import Label from "./Label";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";
import Toast from "./Toast";

const CKEditor = dynamic(
  () => import("@ckeditor/ckeditor5-react").then((m) => m.CKEditor),
  { ssr: false }
);

const Editor = ({ label, name, value, onChange, error }) => {
  const handleEditorChange = useCallback(
    (event, editor) => {
      try {
        const data = editor.getData();
        onChange({ target: { name, value: data } });
      } catch {
        Toast.error("Terjadi kesalahan saat menyimpan data editor.");
      }
    },
    [name, onChange]
  );

  return (
    <div className="mb-3">
      <Label text={label} htmlFor={name} tooltip={label} />
      <CKEditor
        editor={ClassicEditor}
        data={value}
        onChange={handleEditorChange}
        config={{
          plugins: [
            Alignment,
            Essentials,
            Paragraph,
            Bold,
            Italic,
            Table,
            TableToolbar,
            TableProperties,
            TableCellProperties,
            Link,
            Image,
            ImageToolbar,
            ImageCaption,
            ImageStyle,
            ImageResize,
            LinkImage,
            List,
            Heading,
            BlockQuote,
            CodeBlock,
            Underline,
            Strikethrough,
            SimpleUploadAdapter,
            Font,
            MediaEmbed,
            ImageInsert,
            Base64UploadAdapter,
            Mention,
          ],
          toolbar: [
            "heading",
            "|",
            "fontSize",
            "fontFamily",
            "fontColor",
            "fontBackgroundColor",
            "|",
            "bold",
            "italic",
            "underline",
            "strikethrough",
            "|",
            "alignment",
            "|",
            "bulletedList",
            "numberedList",
            "|",
            "link",
            "insertImage",
            "blockQuote",
            "imageStyle:block",
            "imageStyle:side",
            "|",
            "toggleImageCaption",
            "imageTextAlternative",
            "|",
            "linkImage",
            "insertTable",
            "mediaEmbed",
            "|",
            "undo",
            "redo",
          ],
          licenseKey: "GPL",
          image: {
            toolbar: [
              "insertImage",
              "imageTextAlternative",
              "imageStyle:full",
              "imageStyle:side",
            ],
          },
          table: {
            contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
          },
        }}
      />
      {error && <ValidationError message={error} />}
    </div>
  );
};

export default Editor;

Editor.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
};
