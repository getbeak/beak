import useDebounce from '@beak/ui/hooks/use-debounce';
import React, { useEffect, useRef, useState } from 'react';

interface DebouncedInputProps extends Omit<React.HTMLProps<HTMLInputElement>, 'onChange'> {
	type: 'text';
	innerRef?: React.Ref<HTMLInputElement> | null;
	onChange: (value: string) => void;
	value: string;
}

const DebouncedInput: React.FC<React.PropsWithChildren<DebouncedInputProps>> = props => {
	const { innerRef, onChange, ...rest } = props;
	const ref = innerRef ?? null;
	const [localValue, setLocalValue] = useState(props.value);
	const dirtyRef = useRef(false);

	useEffect(() => {
		dirtyRef.current = false;
		setLocalValue(props.value);
	}, [props.value]);

	useDebounce(
		() => {
			if (dirtyRef.current) onChange(localValue);
		},
		300,
		[localValue],
	);

	return (
		<input
			{...rest}
			ref={ref}
			value={localValue}
			onChange={e => {
				dirtyRef.current = true;
				setLocalValue(e.target.value);
			}}
		/>
	);
};

export default DebouncedInput;
