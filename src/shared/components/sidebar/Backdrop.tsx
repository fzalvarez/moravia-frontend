type BackdropProps = {
  visible: boolean;
  onClose: () => void;
};

export function Backdrop({ visible, onClose }: BackdropProps) {
  if (!visible) return null;

  return <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />;
}
