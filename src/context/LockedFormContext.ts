import { createContext, useContext } from 'react';

/** True inside a `LockedFormScope` that's locked — form controls read it to render in their disabled state. */
export const LockedFormContext = createContext(false);

export const useLockedForm = () => useContext(LockedFormContext);
