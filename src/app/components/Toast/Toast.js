import { ToastContainer } from "react-toastify";

export default function Toast(props) {
  const { children } = props;
  return (
    <div>
      <ToastContainer>
        {children}
      </ToastContainer>
    </div>
  )
}