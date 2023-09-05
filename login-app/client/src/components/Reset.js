import React from "react";
import { Link } from "react-router-dom";
import {Toaster} from "react-hot-toast";
import {useFormik} from "formik";
import { resetPasswordValidation } from "../helper/validate";

import styles from '../styles/Username.module.css';

const Reset = () => {
    const formik = useFormik({
        initialValues : {
            password:'',
            confirm_pwd:''
        },
        validate : resetPasswordValidation,
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
            <h4 className="text-3xl font-bold">Reset</h4>
            <span className="py-2 text-l w-2/3 text-center text-gray-500">
              Enter New password
            </span>
          </div>
          <form className="py-10" onSubmit={formik.handleSubmit}>
            <div className="textbox flex flex-col tems-center gap-6">
               <input{...formik.getFieldProps('password')} className={styles.textbox} type="password" placeholder="Password" />
               <input{...formik.getFieldProps('confirm_pwd')} className={styles.textbox} type="password" placeholder="Repeat Password" />
               <button className={styles.btn} type="submit">Sign In</button>
            </div>
            <div className="text-center py-4">
                 <span className="text-gray-500">Forgot Password?<Link className="text-red-500" href="/recovery">Recover Now</Link></span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Reset;

