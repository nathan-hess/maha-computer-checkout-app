import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { PAGES } from './constants';
import { GoogleAnalyticsLogLocation } from './firebase.js';

import NavBar from './components/navbar.js';

import Home from './pages/home.js';

import AccountManagement from './pages/auth/account.js';
import Login from './pages/auth/login.js';
import PasswordReset from './pages/auth/password_reset.js';
import Register from './pages/auth/register.js';

import ComputerCheckout from './pages/computer_checkout/checkout.js';
import Computers from './pages/computer_checkout/computers.js';
import ComputerDetailPage from './pages/computer_checkout/detail.js';
import ExtendReservationPage from './pages/computer_checkout/extend.js';
import MakeDeviceAvailablePage from './pages/computer_checkout/make_available.js';
import ModifyDevicePage from './pages/computer_checkout/modify_device.js';

import UserList from './pages/user_management/users.js';
import ModifyUserPage from './pages/user_management/modify_user.js';

import BackupPage from './pages/backup/backup.js';

import './App.css';


function App() {
    return (
        <div className='App'>
            <Router>
                <GoogleAnalyticsLogLocation />
                <div className='App-header'>
                    <NavBar />
                </div>
                <div className='App-content'>
                    <Routes>
                        <Route exact path={PAGES.home} Component={Home}></Route>

                        <Route exact path={PAGES.login} Component={Login}></Route>
                        <Route exact path={PAGES.password_reset} Component={PasswordReset}></Route>
                        <Route exact path={PAGES.register} Component={Register}></Route>
                        <Route exact path={PAGES.account_mgmt} Component={AccountManagement}></Route>

                        <Route exact path={PAGES.computer_list} Component={Computers}></Route>
                        <Route exact path={PAGES.details + '/:id'} Component={ComputerDetailPage}></Route>
                        <Route exact path={PAGES.checkout + '/:id'} Component={ComputerCheckout}></Route>
                        <Route exact path={PAGES.computer_modify + '/:id'} Component={ModifyDevicePage}></Route>
                        <Route exact path={PAGES.extend_reservation + '/:id'} Component={ExtendReservationPage}></Route>
                        <Route exact path={PAGES.make_available + '/:id'} Component={MakeDeviceAvailablePage}></Route>

                        <Route exact path={PAGES.users} Component={UserList}></Route>
                        <Route exact path={PAGES.user_modify + '/:id'} Component={ModifyUserPage}></Route>

                        <Route exact path={PAGES.backup} Component={BackupPage}></Route>
                    </Routes>
                </div>
            </Router>
        </div>
    );
}

export default App;
