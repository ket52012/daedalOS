import StyledButton from "components/system/Dialogs/StyledButton";
import { useProcessesActions } from "contexts/process";

type ButtonsProps = {
  id: string;
  onClick?: () => void;
};

const Buttons: FC<ButtonsProps> = ({ id, onClick }) => {
  const { closeWithTransition } = useProcessesActions();
  const close = (): void => closeWithTransition(id);

  return (
    <nav className="buttons" role="presentation">
      <StyledButton onClick={onClick || close}>确定</StyledButton>
      <StyledButton onClick={close}>取消</StyledButton>
    </nav>
  );
};

export default Buttons;
