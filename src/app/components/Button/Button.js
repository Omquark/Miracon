export default function Button(props) {
    const { children, onClick, className, id, role } = props;

    return (
        <div>
            <button
                className={
                    'bg-cyan-700 dark:bg-cyan-300 text-slate-300 dark:text-slate-600 ' +
                    'disabled:bg-cyan-300 dark:disabled:bg-cyan-700 disabled:text-slate-600 disabled:dark:text-slate-300 ' +
                    'mx-0.5 mt-1.5 px-2 pb-1 rounded-md ' +
                    'font-bold text-md w-36 ' + className
                }
                onClick={onClick}
                id={id}
                type={role ? role : 'button'}>
                {children}
            </button>
        </div>
    )
}