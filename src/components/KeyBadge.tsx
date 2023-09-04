import { PropsWithChildren } from 'react';

type Props = {}

export const KeyBadge = ({children} : PropsWithChildren<Props>) => <code className='key-badge'>{children}</code>;
