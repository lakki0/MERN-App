import React from "react";
import { Link } from "react-router-dom";
import {Toaster} from "react-hot-toast";
import {useFormik} from "formik";
import { passwordValidate } from "../helper/validate";

import styles from '../styles/Username.module.css';

const Recovery = () => {
    const formik = useFormik({
        initialValues : {
            password:''
        },
        validate : passwordValidate,
        validateOnBlur:false,
        validateOnChange:false,
        onSubmit : async values => {
            console.log(values);
        }
    })
  return (
    <div className="container mx-auto">
       <Toaster position="top-center" reverseOrder={false}></Toaster>
       <div className="flex h-screen justify-center items-center">
       <div className={styles.glass}>
       <div className="title flex flex-col items-center">
            <h4 className="text-3xl font-bold">Rocovery</h4>
            <span className="py-4 text-xl w-2/3 text-center text-gray-500">
              Enter OTP to recover password.
            </span>
          </div>
          <form className="pt" onSubmit={formik.handleSubmit}>
              <div className="textbox flex flex-col tems-center gap-6">
                <div className="input text-center">
                <span className="py-4 text-sm text-left text-gray-500">
                   Enter 6 digit OTP sent to your email address.
                </span>
                </div>
               <input{...formik.getFieldProps('password')} className={styles.textbox} type="password" placeholder="OTP" />
               <button className={styles.btn} type="submit">Recover</button>
            </div>
            <div className="text-center py-4">
                 <span className="text-gray-500">Can't get OTP? <button className="text-red-500">Resend</button></span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Recovery;

