'use client'

import { useEffect, useRef } from "react";

export default function Modal(props) {

    const { id, children, show, setShow, header, footer } = props;
    const isStatic = props.static;

    const modalRef = useRef(undefined);

    useEffect(() => {
        const body = Array.from(document.getElementsByTagName('body'))[0];

        if (show) {
            body.classList.add(['overflow-hidden']);
        }

        const handleOutsideClick = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                if (isStatic) {
                    modalRef.current.classList.add(['scale-[105%]']);
                    setTimeout(() => { modalRef?.current.classList.remove(['scale-[105%]']) }, 100);
                }
                else {
                    setShow(false);
                }
            }
        }

        document.addEventListener('mousedown', (event) => handleOutsideClick(event));

        return () => {
            body.classList.remove(['overflow-hidden']);
            document.removeEventListener('mousedown', (event) => handleOutsideClick(event));
        }
    }, [show]);



    return (
        <div
            className={
                `fixed left-0 w-lvw h-lvh duration-300 bg-slate-700 z-[45] ` +
                `bg-opacity-40 overscroll-contain ` +
                `${show ? '' : 'hidden'}`
            }
            id={id}
            role='dialog' >

            <div className={
                'fixed duration-75 bg-white dark:bg-black z-50 ' +
                'sm:border-4 sm:rounded-3xl ' +
                'sm:inset-y-1/4 xl:inset-y-1/3 ' +
                'h-screen sm:h-1/2 xl:h-1/3 ' +
                'sm:inset-x-1/4 ' +
                'w-screen sm:w-1/2 ' +
                'border-cyan-700 dark:border-cyan-300 ' +
                ' '
            } ref={modalRef}>
                {/*Header*/}
                <div className={
                    ' ' +
                    'border-b-2 h-1/6 flex flex-wrap w-full mx-auto text-2xl font-bold ' +
                    'border-cyan-700 dark:border-cyan-300 overflow-hidden '
                }>
                    <span className='my-auto w-full'>{header}</span>
                </div>
                {/*Body*/}
                <div className={
                    'h-2/3 flex md:mx-auto overflow-y-scroll ' +
                    'px-2 md:px-4 lg:px-8 '
                }>
                    <div className='w-full my-auto '>
                        {children}
                    </div>
                </div>
                {/*Footer*/}
                <div className={
                    'border-t-2 h-1/6 flex flex-wrap z-40 ' +
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