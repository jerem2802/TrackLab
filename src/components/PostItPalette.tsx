interface Props {
  onCreateNote: (color: string) => void;
}

const COLORS = [
  '#ffeb3b', // Jaune
  '#f8bbd9', // Rose  
  '#a5d6a7', // Vert
  '#90caf9', // Bleu
  '#ffcc80', // Orange
  '#ce93d8', // Violet
];

export default function PostItPalette({ onCreateNote }: Props) {
  return (
    <div className="flex gap-1">
      {COLORS.map(color => (
        <button
          key={color}
          onClick={() => onCreateNote(color)}
          className="w-6 h-6 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
          style={{ backgroundColor: color }}
          title="Sélectionner cette couleur"
        />
      ))}
    </div>
  );
}