from setuptools import setup, find_packages

setup(
    name='sales_ui_lock',
    version='0.0.1',
    description='Force roles to specific module and eliminae desktop access',
    author='SurgiShop',
    author_email='gary.starr@surgishop.com',
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=['frappe']
)
