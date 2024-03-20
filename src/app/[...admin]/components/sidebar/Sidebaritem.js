'use client'

import Link from 'next/link';
import { FaChevronDown } from 'react-icons/fa';
import { useEffect, useRef, useState } from 'react';

export function SidebarItem(props) {

    const [expanded, setExpanded] = useState(false);
    const wasExpanded = useRef();

    useEffect(() => {
        setExpanded(wasExpanded.current);
    }, [])

    const { menuName, subMenus } = props;

    const updateExpanded = () => {
        wasExpanded.current = !wasExpanded.current;
        setExpanded(!expanded);
    }

    return (
        <div className=''>
            <div className={`flex duration-300 cursor-pointer`} onClick={() => updateExpanded()}>
                <div className='grow'>
                    <button
                        className='text-start'
                        onClick={() => setExpanded(!expanded)}>
                        {menuName}
                    </button>
                </div>
                {
                    subMenus && Array.isArray(subMenus) ?
                        <button
                            className={`pt-2 duration-300 ${expanded ? 'rotate-0' : 'rotate-90'}`}
                            >
                            <FaChevronDown />
                        </button> : <></> //subMenus && Array.isArray(subMenus)
                }
            </div>
            <div className={`ms-2 duration-300 ${expanded ? '' : 'hidden'}`}>
                {
                    subMenus && Array.isArray(subMenus) ?
                        subMenus.map(sub => {
                            return (
                                <div key={sub}>
                                    <Link href={`/admin/${encodeURIComponent(sub)}`.toLowerCase()} >{sub}</Link>
                                </div>
                            )
                        }) : <></> //subMenus && Array.isArray(subMenus) ?
                }
            </div>
        </div>
    )
}