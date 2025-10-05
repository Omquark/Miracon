'use client'

export default function CheckBox(props) {

  const { id, placeholder, defaultChecked } = props;

  return (
    <div className='w-full py-3 flex my-auto '>
      <input
        className={
          'border-2 min-w-6 min-h-6 ' +
          'rounded-full mr-4 ' +
          'bg-white dark:bg-black ' +
          'border-cyan-700 dark:border-cyan-300 focus:border-blue-700 focus:dark:border-blue-300 ' +
          'hover:bg-gray-300 hover:dark:bg-gray-700 checked:bg-cyan-700 checked:dark:bg-cyan-300 hover:checked:bg-cyan-700 ' +
          'hover:checked:dark:bg-cyan-300 ' +
          'peer '
        }
        type='checkbox'
        defaultChecked={defaultChecked}
        id={id}
      />
      <label
        className={
          'text-base'
        }
        htmlFor={id}
        id={`label-${id}`}
      > {placeholder}</label>
    </div>
  )

}