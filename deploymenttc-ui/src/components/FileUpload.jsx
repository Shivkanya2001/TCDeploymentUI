export default function FileUpload({ onChange }) {
  return (
    <div>
      <label className="block mb-2 mt-4 font-medium">
        Upload Deployment File
      </label>
      <input
        type="file"
        className="w-full border rounded p-2"
        onChange={(e) => {
          // Check if a file is selected before calling onChange
          if (e.target.files && e.target.files[0]) {
            onChange(e.target.files[0]); // Pass the selected file to the parent
          }
        }}
      />
    </div>
  );
}
