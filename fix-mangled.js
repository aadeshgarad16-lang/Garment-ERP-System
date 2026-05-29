const fs = require('fs');
const file = 'c:/Users/USER/Downloads/Sason_Project/garment-erp-system/src/app/(dashboard)/orders/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const brokenRegex = /<label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition whitespace-nowrap">\s*<Upload className="h-4 w-4 mr-2" \/>\s*<span className="truncate max-w-\[100px\]">\{spec\.photoName \|\| "Select Photo"\}<\/span>\s*<input\s*type="file"\s*className="hidden"\s*onChange=\{\(e\) =>\s*updateRow\(spec\.id, "photoName", e\.target\.files\?\.\[0\]\?\.name \|\| ""\)\s*\}\s*\/>\s*className="px-5 py-2\.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"\s*>\s*Submit Order\s*<\/button>/g;

const replacement = `<label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition whitespace-nowrap">
      <Upload className="h-4 w-4 mr-2" />
      <span className="truncate max-w-[100px]">{spec.photoName || "Select Photo"}</span>
      <input
        type="file"
        className="hidden"
        onChange={(e) =>
          updateRow(spec.id, "photoName", e.target.files?.[0]?.name || "")
        }
      />
    </label>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeRow(spec.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* BOTTOM ACTION BUTTONS */}

          <div className="w-full flex justify-end mt-6 border-t border-neutral-200 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSaveDraft}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition"
              >
                Save as Draft
              </button>

              <button
                onClick={() => router.push("/drafts")}
                className="px-5 py-2.5 border border-neutral-300 bg-white rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition"
              >
                View Drafts
              </button>

              <button
                onClick={handleSubmitOrder}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
              >
                Submit Order
              </button>`;

content = content.replace(brokenRegex, replacement);

fs.writeFileSync(file, content);
console.log('Fixed broken JSX');
