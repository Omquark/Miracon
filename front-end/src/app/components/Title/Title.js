'use client'

export default function Title(props){

    const { children } = props;

    return(
        <span className='text-zinc-700 dark:text-zinc-300'>
            {children}
        </span>
    )
}