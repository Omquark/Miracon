import { useEffect, useRef, useState } from "react";
import { IoMdArrowDropdown } from "react-icons/io";

export default function Selection(props) {

    const { className, id, placeholder, values, selected } = props;

    const [vals, setVals] = useState(['']);
    const [selectedValue, setSelectedValue] = useState('');
    const [expanded, setExpanded] = useState(false);

    const dropdownRef = useRef(undefined)

    useEffect(() => {
        setVals(['none', ...values]);
        setSelectedValue(selected ? selected : values[0]);

        document.addEventListener('mousedown', (event) => handleOutsideClick(event));

        return () => {
            document.removeEventListener('mousedown', (event) => handleOutsideClick(event));
        }
    }, [values, selected]);

    const expand = () => {
        setExpanded(!expanded);
    }

    const handleOutsideClick = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setExpanded(false);
        }
    }

    return (
        <div className='relative my-2 '>
            <input
                className={
                    'w-full border-2 border-cyan-700 dark:border-cyan-300 rounded-xl ' +
                    'bg-white h-9 ' +
                    className
                }
                disabled
                value={selectedValue} />
            <label
                className={
                    'absolute transform -top-3 scale-75 left-0 bg-white z-10 ' +
                    'px-0.5 mx-2.5 ' +
                    ' ' +
                    ' '
                }
                id={`label-${id}`}
                htmlFor={id} >
                {placeholder}
            </label>
            <button
                className={
                    'duration-300 ' +
                    'absolute text-3xl transform -translate-x-8 translate-y-1 ' +
                    `${expanded ? '' : 'rotate-90'} `
                }
                onClick={() => expand()} >
                <IoMdArrowDropdown />
            </button>
            <div
                className={
                    'absolute text-left border-2 rounded-xl overflow-y-scroll w-full z-10 ' +
                    'border-cyan-700 dark:border-cyan-300 max-h-48 ' +
                    `${expanded ? '' : 'hidden'}`
                }
                ref={dropdownRef} >
                {
                    vals && Array.isArray(vals) ?
                        vals.map(val => (
                            <div
                                className={
                                    val === selectedValue ?
                                        'bg-blue-700 text-white dark:bg-blue-300 dark:text-black ' :
                                        'bg-white dark:bg-black cursor-pointer '
                                }
                                key={val} >
                                <button
                                    className='w-full text-left ps-2'
                                    onClick={() => { setSelectedValue(val), setExpanded(false) }}>
                                    {val}
                                </button>
                            </div>
                        )) : <></>
                }

            </div>
        </div>
    )
}