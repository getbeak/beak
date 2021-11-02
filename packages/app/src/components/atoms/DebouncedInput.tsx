import useDebounce from '@beak/app/hooks/use-debounce';
import React, { useEffect, useState } from 'react';

interface DebouncedInputProps extends Omit<React.HTMLProps<HTMLInputElement>, 'onChange'> {
	type: 'text';
	innerRef?: React.Ref<HTMLInputElement> | null;
	onChange: (value: string) => void;
	value: string;
}

const DebouncedInput: React.FunctionComponent<DebouncedInputProps> = props => {
	const { innerRef, onChange, ...rest } = props;
	const ref = innerRef ?? null;
	const [localValue, setLocalValue] = useState('');

	useEffect(() => {
		setLocalValue(props.value);
	}, [props.value]);

	useDebounce(() => onChange(localValue), 300, [localValue]);

	return (
		<input
			{...rest}
			ref={ref}
			value={localValue}
			onChange={e => setLocalValue(e.target.value)}
		/>
	);
};

export default DebouncedInput;
