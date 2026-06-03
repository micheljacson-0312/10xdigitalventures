const text = 'SELECT * FROM workspaces WHERE invite_code = ?';
const params = ['TENX2024'];
let pgText = text;
if (params && params.length > 0) {
  let index = 1;
  pgText = text.replace(/\?/g, () => {
    const p = '$' + index;
    index++;
    return p;
  });
}
console.log('Original:', text);
console.log('Converted:', pgText);
