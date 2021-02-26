import { AuthContext } from '../context/authContext';
import Authenticated from '../pages/authenticated/authenticated'
import Unauthenticated from '../pages/unauthenticated/unauthenticated'
import React from 'react';

export default function Layout() {
    const authContext: any = React.useContext(AuthContext);

    React.useEffect(() => { authContext.signIn(true); }, [authContext]);

    return <div className='app-container'>
        {authContext.initialized ? <Authenticated /> : <Unauthenticated hide={authContext.authenticated} />}
    </div>
}
