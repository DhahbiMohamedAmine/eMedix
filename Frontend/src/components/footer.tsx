import "../../public/tailwind.css"



export default function HeaderComponent() {


    return (
        <footer className="bg-gray-900 text-white px-4 py-8 sm:px-8 lg:px-16 xl:px-40 2xl:px-64">
       <div className="flex flex-col md:flex-row justify-between">
         <div>
           <h3 className="font-bold text-2xl">eMedix</h3>
           <p className="text-gray-400 mt-2">Your trusted healthcare partner</p>
         </div>
         <div className="mt-4 md:mt-0">
           <h5 className="uppercase tracking-wider font-semibold text-gray-500">Contact</h5>
           <p className="mt-2">A371, Centre Urb Nord, 1082, Tunis</p>
           <p className="mt-2">+216 25 698 888</p>
         </div>
       </div>
       <div className="mt-8 text-center text-gray-400 text-sm">© 2025 eMedix. All Rights Reserved.</div>
       </footer>
    )}   