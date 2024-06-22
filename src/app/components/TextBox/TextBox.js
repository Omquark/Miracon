'use client'

import { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function TextBox(props) {

    const { placeholder, type, id, value, disabled, className, onChange } = props;

    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const elem = document.getElementById(id);
        if (value) elem.value = value;
    }, [id, value])

    const detectChange = (event) => {
        if (!onChange) return;
        event.preventDefault();
        event.stopPropagation();
        onChange(event);
    }

    return (

        <div className='relative my-1 text-base w-full '>
            <input
                className={
                    'static duration-300 w-full ' +
                    'bg-white dark:bg-black disabled:bg-neutral-200 dark:disabled:bg-neutral-600 rounded-xl px-2 py-1 mt-3 ' +
                    'border-2 border-cyan-700 dark:border-cyan-300 ' +
                    'focus:border-blue-700 focus:dark:border-blue-300 ' +
                    'peer ' + className
                }

                type={(type === 'text' || type === 'password') && !showPassword ? type : 'text'}
                placeholder={' '}
                id={id}
                onChange={(event) => detectChange(event)}
                onBlur={() => setShowPassword(false)}
                defaultValue={value}
                disabled={disabled}
            />
            <label
                className={
                    'absolute duration-300 whitespace-nowrap ' +
                    'hover:cursor-text px-0.5 scale-75 mx-2.5 ' +
                    // 'bg-opacity-100 bg-white dark:bg-black ' +
                    'bg-opacity-100 bg-white peer-placeholder-shown:bg-inherit peer-focus:bg-white ' +
                    'transform left-0 top-0 ' +
                    'peer-placeholder-shown:top-4 peer-placeholder-shown:scale-100 ' +
                    'peer-focus:scale-75 peer-focus:top-0 '
                }
                id={`label-${id}`}

                htmlFor={id}>{placeholder}</label>
            {
                type === 'password' ?
                    <span className={
                        'absolute transform -translate-x-10 mx-1.5 translate-y-5 my-0.5 ' +
                        ' ' +
                        ' '
                    }
                        onClick={() => { document.getElementById(id).focus(); setShowPassword(!showPassword) }}>
                        {
                            showPassword ?
                                <FaEyeSlash /> : //showPassword
                                <FaEye />
                        }
                    </span>
                    : //type === password
                    <></>
            }
        </div>
    )
}