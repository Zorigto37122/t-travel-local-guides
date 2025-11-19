export default function FloatingInput({ id, label, children, ...props }) {
    
    return (
        <div className="InputWrapper">
            <label htmlFor={id} className="FloatingLabel">
                {label}
            </label>
            {children}
        </div>
    );
}