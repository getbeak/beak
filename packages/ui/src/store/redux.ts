import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import type { ApplicationState } from '.';

export const useAppSelector: TypedUseSelectorHook<ApplicationState> = useSelector;

export const useAppDispatch = useDispatch;
