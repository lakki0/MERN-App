import React from "react";
import { Link } from "react-router-dom";
import {Toaster} from "react-hot-toast";
import {useFormik} from "formik";
import { passwordValidate } from "../helper/validate";

import styles from '../styles/Username.module.css';

const Password = () => {
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
            <h4>Hello Again!</h4>
          </div>
          <form className="py-1" onSubmit={formik.handleSubmit}>
            <div className="profile flex justify-center py-4">
               <img className={styles.profile_img} src="profileimg.jpg" alt="image" />
            </div>
            <div className="textbox flex flex-col tems-center gap-6">
               <input{...formik.getFieldProps('password')} className={styles.textbox} type="password" placeholder="Password" />
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

export default Password;

