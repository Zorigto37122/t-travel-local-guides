import './Button.css';

export default function Button({ children, onClick, className = '' }) { 
  return (
    <button className={`Button ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}