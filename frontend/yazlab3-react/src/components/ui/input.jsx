import * as React from "react";

const Input = React.forwardRef(({ type = "text", ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      {...props}
      style={{
        padding: "8px",
        border: "1px solid #ccc",
        borderRadius: "6px",
        width: "100%",
      }}
    />
  );
});

Input.displayName = "Input";

export default Input;
