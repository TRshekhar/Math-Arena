export default function QRCode({ data, size = 120 }) {
  const cells = 17;
  let seed = data.split('').reduce((s, c) => (s * 31 + c.charCodeAt(0)) | 0, 0);
  let r = Math.abs(seed);
  const grid = [];
  for (let i = 0; i < cells * cells; i++) {
    r = (r * 1103515245 + 12345) & 0x7fffffff;
    grid.push(r % 3 !== 0);
  }
  [[0,0],[0,cells-7],[cells-7,0]].forEach(([row,col]) => {
    for (let dr = 0; dr < 7; dr++) for (let dc = 0; dc < 7; dc++) {
      const idx = (row+dr)*cells + (col+dc);
      if (idx < grid.length)
        grid[idx] = (dr===0||dr===6||dc===0||dc===6||(dr>=2&&dr<=4&&dc>=2&&dc<=4));
    }
  });
  const cs = (size - 12) / cells;
  return (
    <svg width={size} height={size}
      style={{ background:'white', padding:'6px', borderRadius:'10px', display:'block' }}>
      {grid.map((v, i) => v ? (
        <rect key={i}
          x={(i % cells) * cs} y={Math.floor(i / cells) * cs}
          width={cs - .5} height={cs - .5}
          fill="#111" rx=".5"/>
      ) : null)}
    </svg>
  );
}
