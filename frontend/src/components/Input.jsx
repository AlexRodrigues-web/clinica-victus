// frontend/src/components/Input.jsx
import './Input.css';

const Input = ({ label, type, value, onChange, placeholder }) => (
  <div className="input-group">
    <label>{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required
    />
  </div>
);

export default Input;
