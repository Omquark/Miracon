'use client'

import { useEffect, useState } from "react";
import Button from "../Button/Button";

export default function Modal(props) {

    const { id, children, show, setShow, header, footer } = props;
    const isStatic = props.static;

    useEffect(() => {
        const handleOutsideClick = (event) => {
            
        }
    });

    return (
        <div
            className={
                `absolute top-0 left-0 w-full h-full z-10 duration-300 bg-slate-700 ` +
                `bg-opacity-40 overscroll-contain ` +
                `${show ? '' : 'hidden'}`
            }
            id={id}
            role='dialog' >

            <div className={
                'fixed inset-x-1/4 inset-y-1/4 z-15 bg-white dark:bg-black ' +
                'border-4 w-1/2 h-1/2 rounded-3xl ' +
                'border-cyan-700 dark:border-cyan-300 ' +
                ' '
            }>
                {/*Header*/}
                <div className={
                    'border-b-2 h-1/6 flex flex-wrap w-full mx-auto text-2xl font-bold ' +
                    'border-cyan-700 dark:border-cyan-300 '
                }>
                    <span className='my-auto w-full '>{header}</span>
                </div>
                {/*Body*/}
                <div className='flex-wrap h-2/3 w-3/4 flex mx-auto px-4 overflow-y-scroll '>
                    <div className='w-full my-auto '>
                        {children}
                    </div>
                </div>
                {/*Footer*/}
                <div className={
                    'border-t-2 h-1/6 flex flex-wrap ' +
                    'border-cyan-700 dark:border-cyan-300 '
                }>
                    <div className='my-auto mx-auto flex '>
                        {footer}
                    </div>
                </div>
            </div>
        </div>
    )
}