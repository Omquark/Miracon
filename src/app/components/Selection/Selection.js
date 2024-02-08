import { IoMdArrowDropdown } from 'react-icons/io'
import { useEffect, useRef, useState } from "react";

export default function Selection(props) {

    const { className, id, placeholder, values } = props;

    const [expanded, setExpanded] = useState(false);
    const [expVals, setExpVals] = useState({});
    const dropdownRef = useRef(undefined); //Used as a ref for the dropdown box

    useEffect(() => {
        setExpVals(values);

        Array.from(
            document
                .getElementById(id)
                .getElementsByTagName('input'))
            .filter(input => input.type === 'checkbox')
            .forEach(check => {
                check.checked = values[check.id.substring(check.id.indexOf('-') + 1)];
            })

        document.addEventListener('mousedown', (event) => handleOutsideClick(event));

        return () => {
            document.removeEventListener('mousedown', (event) => handleOutsideClick(event));
        }
    }, [props.values])

    const expand = () => {
        setExpanded(!expanded);
    }

    const handleOutsideClick = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setExpanded(false);
        }
    }

    const updateSelected = (val) => {
        const updateCheck = document.getElementById(`check-${val}`);
        const newVals = { ...expVals };
        newVals[val] = !newVals[val];
        updateCheck.checked = newVals[val];
        setExpVals(newVals);
    }

    return (
        <div
            className='relative w-full py-1 mt-3 '
            id={id}>
            <div className={
                'duration-300 border-2 rounded-xl bg-white dark:bg-black ' +
                'border-cyan-700 dark:border-cyan-300 ' +
                className
            }>
                <input
                    className={
                        'w-[98%] ps-2 my-1 bg-white dark:bg-black '
                    }
                    disabled
                    value={placeholder} />
                <button
                    className={
                        'duration-300 ' +
                        'absolute text-3xl transform -translate-x-6 translate-y-0.5 ' +
                        `${expanded ? '' : 'rotate-90 '}`
                    }
                    onClick={() => expand()}
                    type='button'>
                    <IoMdArrowDropdown />
                </button>
            </div>
            {
                //expanded ?
                <div
                    className={
                        'absolute text-left border-2 rounded-xl overflow-hidden w-full z-10 ' +
                        'border-cyan-700 dark:border-cyan-300 ' +
                        `${expanded ? '' : 'hidden'}`
                    }
                    ref={dropdownRef} >
                    {
                        Object.keys(values).map(val => (
                            <div key={val}
                                className={
                                    'ps-2 ' +
                                    `${expVals[val] ?
                                        'bg-blue-700 text-white dark:bg-blue-300 dark:text-black' :
                                        'bg-white text-black dark dark:bg-black dark:text-white'}`
                                }
                                onClick={() => updateSelected(val)}>

                                <input
                                    className={
                                        `hidden`
                                    }
                                    id={`check-${val}`}
                                    type='checkbox'
                                    value={val}
                                    onClick={(event) => { event.preventDefault(); event.stopPropagation(); }} />
                                <label
                                    className={
                                        ''
                                    }
                                    htmlFor={`check-${val}`}>{val}</label>
                            </div>
                        ))
                    }
                </div> //: <></> //expanded ?
            }
        </div >
    )
}