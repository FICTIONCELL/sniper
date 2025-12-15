import { motion } from "framer-motion";
import { ReactNode } from "react";

interface MotionWrapperProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

export const MotionWrapper = ({ children, className = "", delay = 0 }: MotionWrapperProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
                duration: 0.4,
                delay,
                type: "spring",
                stiffness: 100,
                damping: 15
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export const Card3D = ({ children, className = "" }: { children: ReactNode, className?: string }) => {
    return (
        <motion.div
            whileHover={{
                scale: 1.02,
                rotateX: 2,
                rotateY: 2,
                boxShadow: "20px 20px 60px -15px rgba(0, 0, 0, 0.3)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`card-3d ${className}`}
            style={{ transformStyle: "preserve-3d" }}
        >
            {children}
        </motion.div>
    );
};
